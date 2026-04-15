package com.dealeros.service;

import com.dealeros.config.FileStorageConfig;
import com.dealeros.model.*;
import com.dealeros.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * Two-way Excel synchronisation.
 *
 * IMPORT  — reads Master_Spreadsheet.xlsx and upserts into DB
 * EXPORT  — reads DB and writes a fresh Master_Spreadsheet.xlsx
 *
 * Sheet mapping:
 *   "Sold Stock"       ←→ sold_vehicles
 *   "Stock Data"       ←→ vehicles (STOCK status)
 *   "Collection"       ←→ collection_entries (type=COLLECTION)
 *   "Investor Budget"  ←→ investors
 *   "Expense"          ←→ finance_entries
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelSyncService {

    private final FileStorageConfig       fileConfig;
    private final VehicleRepository       vehicleRepo;
    private final SoldVehicleRepository   soldRepo;
    private final CollectionEntryRepository colRepo;
    private final InvestorRepository      investorRepo;
    private final FinanceEntryRepository  financeRepo;
    private final VehicleService          vehicleService;

    // ══════════════════════════════════════════════════════
    // IMPORT
    // ══════════════════════════════════════════════════════

    @Transactional
    public Map<String, Integer> importFromExcel(InputStream xlsxStream) throws IOException {
        Map<String, Integer> counts = new LinkedHashMap<>();

        try (Workbook wb = new XSSFWorkbook(xlsxStream)) {
            counts.put("soldVehicles",  importSoldStock(wb));
            counts.put("stockVehicles", importStockData(wb));
            counts.put("collections",   importCollections(wb));
            counts.put("investors",     importInvestorBudget(wb));
            counts.put("expenses",      importExpenses(wb));
        }

        log.info("Excel import complete: {}", counts);
        return counts;
    }

    /** Imports from the default Excel path configured in application.properties */
    @Transactional
    public Map<String, Integer> importFromDefaultFile() throws IOException {
        Path xlsxPath = fileConfig.getExcelPath();
        if (!Files.exists(xlsxPath)) {
            throw new FileNotFoundException("Excel file not found at: " + xlsxPath);
        }
        try (InputStream is = new FileInputStream(xlsxPath.toFile())) {
            return importFromExcel(is);
        }
    }

    // ── "Sold Stock" sheet ────────────────────────────────
    private int importSoldStock(Workbook wb) {
        Sheet sheet = wb.getSheet("Sold Stock");
        if (sheet == null) return 0;

        int count = 0;
        // Row 1 = blank header row, row 2 = column labels, data starts row 3 (index 2)
        for (int i = 2; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            String plate = str(row, 2);
            if (plate == null || plate.isBlank()) continue;
            plate = plate.toUpperCase().replaceAll("\\s+", "");

            // Skip if already imported
            if (soldRepo.findByPlateIgnoreCase(plate).isPresent()) {
                count++;
                continue;
            }

            SoldVehicle sv = new SoldVehicle();
            sv.setPlate(plate);
            sv.setModel(str(row, 3));
            sv.setInvestor(str(row, 4));
            sv.setTotalCost(decimal(row, 5));
            sv.setSoldPrice(decimal(row, 6));
            sv.setPartExValue(decimal(row, 7));
            sv.setInvestorSharePct(intVal(row, 8));

            BigDecimal totalProfit   = decimal(row, 9);
            BigDecimal investorProfit = decimal(row, 10);
            BigDecimal saProfit       = decimal(row, 11);
            sv.setGrossProfit(totalProfit);
            sv.setInvestorProfit(investorProfit);
            sv.setSaProfit(saProfit);

            sv.setDateAcquired(date(row, 1));
            sv.setDateSold(date(row, 13));

            if (sv.getDateAcquired() != null && sv.getDateSold() != null) {
                long days = java.time.temporal.ChronoUnit.DAYS.between(sv.getDateAcquired(), sv.getDateSold());
                sv.setDaysInStock((int) days);
            }

            // Generate a stock ID for historical records
            sv.setStockId(vehicleService.generateStockId());

            soldRepo.save(sv);
            count++;
        }
        return count;
    }

    // ── "Stock Data" sheet ────────────────────────────────
    private int importStockData(Workbook wb) {
        Sheet sheet = wb.getSheet("Stock Data");
        if (sheet == null) return 0;

        int count = 0;
        // Row 1 = blank, row 2 = labels, data from row 3 (index 2)
        for (int i = 2; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            String plate = str(row, 3);
            if (plate == null || plate.isBlank()) continue;
            plate = plate.toUpperCase().replaceAll("\\s+", "");

            // Skip if already in DB
            if (vehicleRepo.existsByPlateIgnoreCase(plate)) {
                count++;
                continue;
            }

            Vehicle v = new Vehicle();
            v.setPlate(plate);
            v.setModel(str(row, 4));
            v.setInvestor(str(row, 5));
            v.setSource(str(row, 6));
            v.setPxValue(decimal(row, 7));
            v.setPurchasePrice(decimal(row, 8));
            v.setReconCost(decimal(row, 9));
            v.setTotalCost(decimal(row, 10));
            v.setDateAcquired(date(row, 2));

            String statusCell = str(row, 13);
            if ("Sold".equalsIgnoreCase(statusCell)) {
                v.setStatus(VehicleStatus.SOLD);
            } else {
                v.setStatus(VehicleStatus.STOCK);
            }

            v.setStockId(vehicleService.generateStockId());
            vehicleRepo.save(v);

            // Create folder structure for active stock
            if (v.getStatus() == VehicleStatus.STOCK) {
                try {
                    fileConfig.getVehicleFolder(v.getStockId());
                } catch (IOException e) {
                    log.warn("Folder creation failed for {}: {}", v.getStockId(), e.getMessage());
                }
            }
            count++;
        }
        return count;
    }

    // ── "Collection" sheet ────────────────────────────────
    private int importCollections(Workbook wb) {
        Sheet sheet = wb.getSheet("Collection");
        if (sheet == null) return 0;

        int count = 0;
        // Row 0 = headers, data from row 1 (index 1)
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            String plate = str(row, 2);
            if (plate == null || plate.isBlank()) continue;
            plate = plate.toUpperCase().replaceAll("\\s+", "");

            if (!colRepo.findByPlateIgnoreCase(plate).isEmpty()) {
                count++;
                continue;
            }

            CollectionEntry c = new CollectionEntry();
            c.setType(CollectionType.COLLECTION);
            c.setPlate(plate);
            c.setModel(str(row, 3));
            c.setDateWon(date(row, 1));
            c.setAddress(str(row, 4));
            c.setPostcode(str(row, 5));
            c.setDistance(str(row, 6));
            c.setScheduledDate(date(row, 7));
            c.setStatus("Pending");
            c.setNotes(str(row, 9));

            colRepo.save(c);
            count++;
        }
        return count;
    }

    // ── "Investor Budget" sheet ───────────────────────────
    private int importInvestorBudget(Workbook wb) {
        Sheet sheet = wb.getSheet("Investor Budget");
        if (sheet == null) return 0;

        int count = 0;
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            String name = str(row, 0);
            if (name == null || name.isBlank()) continue;

            Investor inv = investorRepo.findByNameIgnoreCase(name)
                    .orElseGet(() -> { Investor n = new Investor(); n.setName(name); return n; });

            BigDecimal initial = decimal(row, 1);
            if (initial != null) inv.setInitialBalance(initial);
            inv.recalc();

            investorRepo.save(inv);
            count++;
        }
        return count;
    }

    // ── "Expense" sheet ───────────────────────────────────
    private int importExpenses(Workbook wb) {
        Sheet sheet = wb.getSheet("Expense");
        if (sheet == null) return 0;

        int count = 0;
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            BigDecimal amount = decimal(row, 4);
            if (amount == null) continue;

            FinanceEntry fe = new FinanceEntry();
            fe.setDate(date(row, 1));
            fe.setCategory(str(row, 2));
            fe.setDescription(str(row, 3) != null ? str(row, 3) : "Imported");
            fe.setAmount(amount);
            fe.setPaymentMethod(str(row, 5));
            fe.setPaidBy(str(row, 6));
            fe.setNotes(str(row, 7));

            // Link to vehicle if notes contain a plate-like pattern
            String notes = fe.getNotes();
            if (notes != null && notes.matches(".*[A-Z]{2}[0-9]{2}\\s?[A-Z]{3}.*")) {
                fe.setPlate(notes.replaceAll(".*(([A-Z]{2}[0-9]{2}\\s?[A-Z]{3})).*", "$1").toUpperCase().replaceAll("\\s+", ""));
            }

            financeRepo.save(fe);
            count++;
        }
        return count;
    }

    // ══════════════════════════════════════════════════════
    // EXPORT
    // ══════════════════════════════════════════════════════

    public byte[] exportToExcel() throws IOException {
        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            exportSoldStock(wb);
            exportStockData(wb);
            exportCollections(wb);
            exportInvestorBudget(wb);
            exportExpenses(wb);

            wb.write(out);
            return out.toByteArray();
        }
    }

    private void exportSoldStock(Workbook wb) {
        Sheet sheet = wb.createSheet("Sold Stock");
        String[] headers = {"Month", "Date Acquired", "Plate", "Make & Model",
                "Investor", "Total Cost", "Sold", "Part Ex",
                "Investor Share %", "Total Profit", "Investor Profit", "SA Profit",
                "Date Listed", "Date Sold", "Days to Sell"};
        writeHeaders(sheet, headers);

        List<SoldVehicle> sold = soldRepo.findAllByOrderByDateSoldDesc();
        for (int i = 0; i < sold.size(); i++) {
            SoldVehicle s = sold.get(i);
            Row row = sheet.createRow(i + 1);
            setCellStr(row, 0, s.getDateSold() != null ? s.getDateSold().withDayOfMonth(1).toString() : "");
            setCellDate(row, 1, s.getDateAcquired());
            setCellStr(row, 2, s.getPlate());
            setCellStr(row, 3, s.getModel());
            setCellStr(row, 4, s.getInvestor());
            setCellNum(row, 5, s.getTotalCost());
            setCellNum(row, 6, s.getSoldPrice());
            setCellNum(row, 7, s.getPartExValue());
            setCellNum(row, 8, s.getInvestorSharePct() != null ? BigDecimal.valueOf(s.getInvestorSharePct()) : null);
            setCellNum(row, 9, s.getGrossProfit());
            setCellNum(row, 10, s.getInvestorProfit());
            setCellNum(row, 11, s.getSaProfit());
            setCellDate(row, 12, s.getDateListed());
            setCellDate(row, 13, s.getDateSold());
            setCellNum(row, 14, s.getDaysInStock() != null ? BigDecimal.valueOf(s.getDaysInStock()) : null);
        }
    }

    private void exportStockData(Workbook wb) {
        Sheet sheet = wb.createSheet("Stock Data");
        String[] headers = {"Month", "Date Acquired", "Plate", "Make & Model",
                "Investor/SA", "Source", "PX Value", "Price",
                "Recon Cost", "Total Cost", "Sold", "Profit", "Status"};
        writeHeaders(sheet, headers);

        List<Vehicle> vehicles = vehicleRepo.findAll();
        for (int i = 0; i < vehicles.size(); i++) {
            Vehicle v = vehicles.get(i);
            Row row = sheet.createRow(i + 1);
            setCellStr(row, 0, v.getDateAcquired() != null ? v.getDateAcquired().withDayOfMonth(1).toString() : "");
            setCellDate(row, 1, v.getDateAcquired());
            setCellStr(row, 2, v.getPlate());
            setCellStr(row, 3, v.getModel());
            setCellStr(row, 4, v.getInvestor());
            setCellStr(row, 5, v.getSource());
            setCellNum(row, 6, v.getPxValue());
            setCellNum(row, 7, v.getPurchasePrice());
            setCellNum(row, 8, v.getReconCost());
            setCellNum(row, 9, v.getTotalCost());
            setCellStr(row, 11, v.getStatus() != null ? v.getStatus().name() : "");
        }
    }

    private void exportCollections(Workbook wb) {
        Sheet sheet = wb.createSheet("Collection");
        String[] headers = {"Source", "Date Won", "Plate", "Make & Model",
                "Location", "Post Code", "Distance", "Collection Date", "Notes"};
        writeHeaders(sheet, headers);

        List<CollectionEntry> cols = colRepo.findAllByOrderByScheduledDateDesc();
        for (int i = 0; i < cols.size(); i++) {
            CollectionEntry c = cols.get(i);
            Row row = sheet.createRow(i + 1);
            setCellStr(row, 0, c.getDriver());
            setCellDate(row, 1, c.getDateWon());
            setCellStr(row, 2, c.getPlate());
            setCellStr(row, 3, c.getModel());
            setCellStr(row, 4, c.getAddress());
            setCellStr(row, 5, c.getPostcode());
            setCellStr(row, 6, c.getDistance());
            setCellDate(row, 7, c.getScheduledDate());
            setCellStr(row, 8, c.getNotes());
        }
    }

    private void exportInvestorBudget(Workbook wb) {
        Sheet sheet = wb.createSheet("Investor Budget");
        String[] headers = {"Investors", "Initial Balance", "Capital Returned",
                "Total Balance", "Purchased", "Total Profit", "Available"};
        writeHeaders(sheet, headers);

        List<Investor> investors = investorRepo.findAll();
        for (int i = 0; i < investors.size(); i++) {
            Investor inv = investors.get(i);
            Row row = sheet.createRow(i + 1);
            setCellStr(row, 0, inv.getName());
            setCellNum(row, 1, inv.getInitialBalance());
            setCellNum(row, 2, inv.getCapitalReturned());
            setCellNum(row, 3, inv.getTotalBalance());
            setCellNum(row, 4, inv.getPurchased());
            setCellNum(row, 5, inv.getTotalProfit());
            setCellNum(row, 6, inv.getAvailable());
        }
    }

    private void exportExpenses(Workbook wb) {
        Sheet sheet = wb.createSheet("Expense");
        String[] headers = {"Month", "Date", "Category", "Description",
                "Amount", "Payment Method", "Paid By", "Notes"};
        writeHeaders(sheet, headers);

        List<FinanceEntry> entries = financeRepo.findAllByOrderByDateDesc();
        for (int i = 0; i < entries.size(); i++) {
            FinanceEntry fe = entries.get(i);
            Row row = sheet.createRow(i + 1);
            setCellStr(row, 0, fe.getDate() != null ? fe.getDate().withDayOfMonth(1).toString() : "");
            setCellDate(row, 1, fe.getDate());
            setCellStr(row, 2, fe.getCategory());
            setCellStr(row, 3, fe.getDescription());
            setCellNum(row, 4, fe.getAmount());
            setCellStr(row, 5, fe.getPaymentMethod());
            setCellStr(row, 6, fe.getPaidBy());
            setCellStr(row, 7, fe.getNotes());
        }
    }

    // ══════════════════════════════════════════════════════
    // Cell read helpers
    // ══════════════════════════════════════════════════════

    private String str(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isADateFormat(
                    (int) cell.getCellStyle().getDataFormat(),
                    cell.getCellStyle().getDataFormatString())
                    ? null : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getRichStringCellValue().getString().trim(); }
                catch (Exception e) { yield ""; }
            }
            default -> null;
        };
    }

    private BigDecimal decimal(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue()).setScale(2, java.math.RoundingMode.HALF_UP);
        }
        if (cell.getCellType() == CellType.STRING) {
            try { return new BigDecimal(cell.getStringCellValue().replaceAll("[£,]", "").trim()); }
            catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private Integer intVal(Row row, int col) {
        BigDecimal d = decimal(row, col);
        return d != null ? d.intValue() : null;
    }

    private LocalDate date(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        if (cell.getCellType() == CellType.STRING) {
            try { return LocalDate.parse(cell.getStringCellValue().trim().substring(0, 10)); }
            catch (Exception e) { return null; }
        }
        return null;
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    // ══════════════════════════════════════════════════════
    // Cell write helpers
    // ══════════════════════════════════════════════════════

    private void writeHeaders(Sheet sheet, String[] headers) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            setCellStr(row, i, headers[i]);
        }
    }

    private void setCellStr(Row row, int col, String val) {
        row.createCell(col).setCellValue(val != null ? val : "");
    }

    private void setCellNum(Row row, int col, BigDecimal val) {
        if (val != null) row.createCell(col).setCellValue(val.doubleValue());
        else row.createCell(col).setBlank();
    }

    private void setCellDate(Row row, int col, LocalDate val) {
        if (val != null) row.createCell(col).setCellValue(val.toString());
        else row.createCell(col).setBlank();
    }
}
