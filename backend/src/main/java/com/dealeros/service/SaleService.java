package com.dealeros.service;

import com.dealeros.model.*;
import com.dealeros.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Optional;

/**
 * Handles the full "Sell a Car" workflow:
 *  1. Validate vehicle is in STOCK
 *  2. Calculate profit & investor share
 *  3. Create SoldVehicle record
 *  4. Create InvestorInvoice
 *  5. Update Vehicle status to SOLD
 *  6. Update Investor totals
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SaleService {

    private final VehicleRepository        vehicleRepo;
    private final SoldVehicleRepository    soldRepo;
    private final InvestorInvoiceRepository invoiceRepo;
    private final InvestorRepository       investorRepo;
    private final VehicleService           vehicleService;

    // ── Sell ──────────────────────────────────────────────

    @Transactional
    public InvestorInvoice sellVehicle(String stockId,
                                       BigDecimal salePrice,
                                       String     investor,
                                       int        sharePct,
                                       LocalDate  saleDate,
                                       String     paymentMethod,
                                       String     customerName,
                                       String     warranty) {

        Vehicle v = vehicleRepo.findByStockId(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + stockId));

        if (v.getStatus() != VehicleStatus.STOCK && v.getStatus() != VehicleStatus.RESERVED) {
            throw new IllegalStateException("Vehicle " + stockId + " is not available for sale (status: " + v.getStatus() + ")");
        }

        // Refresh cost before computing profit
        vehicleService.refreshTotalCost(v);
        vehicleRepo.save(v);

        BigDecimal totalCost    = v.getTotalCost()     != null ? v.getTotalCost()     : BigDecimal.ZERO;
        BigDecimal grossProfit  = salePrice.subtract(totalCost);
        BigDecimal invShare     = grossProfit.multiply(BigDecimal.valueOf(sharePct)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal saShare      = grossProfit.subtract(invShare);

        // ── 1. Create SoldVehicle ─────────────────────────
        SoldVehicle sold = new SoldVehicle();
        sold.setStockId(v.getStockId());
        sold.setPlate(v.getPlate());
        sold.setMake(v.getMake());
        sold.setModel(v.getModel());
        sold.setInvestor(investor);
        sold.setSource(v.getSource());
        sold.setDateAcquired(v.getDateAcquired());
        sold.setDateSold(saleDate != null ? saleDate : LocalDate.now());
        if (v.getDateAcquired() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(v.getDateAcquired(), sold.getDateSold());
            sold.setDaysInStock((int) days);
        }
        sold.setPurchasePrice(v.getPurchasePrice());
        sold.setTotalCost(totalCost);
        sold.setSoldPrice(salePrice);
        sold.setInvestorSharePct(sharePct);
        sold.setGrossProfit(grossProfit);
        sold.setInvestorProfit(invShare);
        sold.setSaProfit(saShare);
        sold.setPaymentMethod(paymentMethod);
        sold.setCustomerName(customerName);
        sold.setWarranty(warranty);
        soldRepo.save(sold);

        // ── 2. Create InvestorInvoice ─────────────────────
        InvestorInvoice inv = new InvestorInvoice();
        inv.setInvoiceNumber(generateInvoiceNumber());
        inv.setStockId(v.getStockId());
        inv.setPlate(v.getPlate());
        inv.setMake(v.getMake());
        inv.setModel(v.getModel());
        inv.setColour(v.getColour());
        inv.setYear(v.getYear());
        inv.setMileage(v.getMileage());
        inv.setInvestorName(investor);
        inv.setInvestorSharePct(sharePct);
        inv.setSaleDate(sold.getDateSold());
        inv.setInvoiceDate(LocalDate.now());
        inv.setPurchasePrice(v.getPurchasePrice());
        inv.setReconCost(v.getReconCost());
        inv.setAdditionalCosts(v.getAdditionalCosts());
        inv.setTotalCost(totalCost);
        inv.setSalePrice(salePrice);
        inv.setGrossProfit(grossProfit);
        inv.setInvestorAmount(invShare);
        inv.setSaAmount(saShare);
        inv.setPaymentMethod(paymentMethod);
        inv.setCustomerName(customerName);
        inv.setWarranty(warranty);
        invoiceRepo.save(inv);

        // ── 3. Mark vehicle SOLD ──────────────────────────
        v.setStatus(VehicleStatus.SOLD);
        vehicleRepo.save(v);

        // ── 4. Update investor totals ─────────────────────
        investorRepo.findByNameIgnoreCase(investor).ifPresent(i -> {
            i.setTotalProfit(i.getTotalProfit().add(invShare));
            // Reduce 'purchased' by the cost this vehicle carried
            i.setPurchased(i.getPurchased().subtract(totalCost).max(BigDecimal.ZERO));
            i.recalc();
            investorRepo.save(i);
        });

        log.info("Sale completed: {} sold for £{} — profit £{} (investor: {} £{})",
                stockId, salePrice, grossProfit, investor, invShare);

        return inv;
    }

    // ── Sold history ──────────────────────────────────────

    public List<SoldVehicle> getAllSold() {
        return soldRepo.findAllByOrderByDateSoldDesc();
    }

    public Optional<SoldVehicle> findSoldByStockId(String stockId) {
        return soldRepo.findByStockId(stockId);
    }

    // ── Invoices ──────────────────────────────────────────

    public List<InvestorInvoice> getAllInvoices() {
        return invoiceRepo.findAllByOrderByInvoiceDateDesc();
    }

    public Optional<InvestorInvoice> findInvoice(String invoiceNumber) {
        return invoiceRepo.findByInvoiceNumber(invoiceNumber);
    }

    // ── Helpers ───────────────────────────────────────────

    private String generateInvoiceNumber() {
        Integer max = invoiceRepo.findMaxInvoiceSequence();
        int next = (max == null ? 0 : max) + 1;
        return String.format("INV-%d-%05d", Year.now().getValue(), next);
    }
}
