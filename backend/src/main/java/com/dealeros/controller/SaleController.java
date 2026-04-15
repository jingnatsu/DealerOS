package com.dealeros.controller;

import com.dealeros.model.*;
import com.dealeros.repository.VehicleRepository;
import com.dealeros.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService       saleService;
    private final VehicleRepository vehicleRepo;

    // ── Sell a Car ────────────────────────────────────────

    @PostMapping("/sell")
    public ResponseEntity<?> sellVehicle(@RequestBody Map<String, Object> body) {
        try {
            String stockId   = (String) body.get("stockId");
            BigDecimal salePrice = new BigDecimal(body.get("salePrice").toString());

            // investor / sharePct may be omitted — fall back to vehicle record
            Vehicle vehicle = vehicleRepo.findByStockId(stockId)
                    .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + stockId));

            String investor = body.get("investor") != null
                    ? body.get("investor").toString()
                    : vehicle.getInvestor();
            int sharePct = body.get("investorSharePct") != null
                    ? Integer.parseInt(body.get("investorSharePct").toString())
                    : (vehicle.getInvestorSharePct() != null ? vehicle.getInvestorSharePct() : 0);

            LocalDate  saleDate      = body.get("saleDate") != null ? LocalDate.parse((String) body.get("saleDate")) : LocalDate.now();
            String     paymentMethod = (String) body.getOrDefault("paymentMethod", "");
            String     customerName  = (String) body.getOrDefault("customerName", "");
            String     warranty      = (String) body.getOrDefault("warranty", "");

            InvestorInvoice invoice = saleService.sellVehicle(
                    stockId, salePrice, investor, sharePct, saleDate,
                    paymentMethod, customerName, warranty);

            return ResponseEntity.status(HttpStatus.CREATED).body(invoice);

        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Sold history ──────────────────────────────────────

    @GetMapping("/sold")
    public List<SoldVehicle> getAllSold() {
        return saleService.getAllSold();
    }

    @GetMapping("/sold/{stockId}")
    public ResponseEntity<SoldVehicle> getSoldByStockId(@PathVariable String stockId) {
        return saleService.findSoldByStockId(stockId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Invoices ──────────────────────────────────────────

    @GetMapping("/invoices")
    public List<InvestorInvoice> getAllInvoices() {
        return saleService.getAllInvoices();
    }

    @GetMapping("/invoices/{invoiceNumber}")
    public ResponseEntity<InvestorInvoice> getInvoice(@PathVariable String invoiceNumber) {
        return saleService.findInvoice(invoiceNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
