package com.dealeros.controller;

import com.dealeros.model.*;
import com.dealeros.repository.*;
import com.dealeros.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptRepository      receiptRepo;
    private final FinanceEntryRepository financeRepo;
    private final FileStructureService   fileService;
    private final VehicleService         vehicleService;

    @GetMapping
    public List<Receipt> getAll() {
        return receiptRepo.findAllByOrderByReceiptDateDesc();
    }

    /**
     * Upload a receipt image, save it to the vehicle folder,
     * create a FinanceEntry, and link the receipt record.
     */
    @PostMapping
    public ResponseEntity<?> uploadReceipt(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String plate,
            @RequestParam(defaultValue = "Other") String category,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String receiptDate) {
        try {
            Receipt receipt = new Receipt();
            receipt.setPlate(plate != null ? plate.toUpperCase().replaceAll("\\s+", "") : null);
            receipt.setCategory(category);
            receipt.setNotes(notes);
            receipt.setAmount(amount);
            receipt.setReceiptDate(receiptDate != null ? LocalDate.parse(receiptDate) : LocalDate.now());

            // Resolve stockId from plate
            if (receipt.getPlate() != null) {
                vehicleService.findByPlate(receipt.getPlate())
                        .ifPresent(v -> receipt.setStockId(v.getStockId()));
            }

            // Save file
            String stockId = receipt.getStockId() != null ? receipt.getStockId() : "MISC";
            String path = fileService.saveVehicleFile(stockId, "DOCUMENT", file);
            receipt.setFilePath("/" + path);

            // Create FinanceEntry if amount provided
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                FinanceEntry fe = new FinanceEntry();
                fe.setStockId(receipt.getStockId());
                fe.setPlate(receipt.getPlate());
                fe.setCategory(category);
                fe.setDescription("Receipt: " + (notes != null ? notes : file.getOriginalFilename()));
                fe.setAmount(amount);
                fe.setDate(receipt.getReceiptDate());
                fe.setReceiptPath(receipt.getFilePath());
                FinanceEntry saved = financeRepo.save(fe);
                receipt.setFinanceEntryId(saved.getId());

                // Refresh vehicle total cost
                if (receipt.getStockId() != null) {
                    vehicleService.findByStockId(receipt.getStockId()).ifPresent(v -> {
                        vehicleService.refreshTotalCost(v);
                    });
                }
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(receiptRepo.save(receipt));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        receiptRepo.findById(id).ifPresent(r -> {
            // Also delete linked finance entry
            if (r.getFinanceEntryId() != null) financeRepo.deleteById(r.getFinanceEntryId());
            receiptRepo.delete(r);
        });
        return ResponseEntity.noContent().build();
    }
}
