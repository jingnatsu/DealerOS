package com.dealeros.controller;

import com.dealeros.model.Investor;
import com.dealeros.model.InvestorInvoice;
import com.dealeros.repository.*;
import com.dealeros.service.FileStructureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investors")
@RequiredArgsConstructor
public class InvestorController {

    private final InvestorRepository        repo;
    private final InvestorInvoiceRepository invoiceRepo;
    private final SoldVehicleRepository     soldRepo;
    private final VehicleRepository         vehicleRepo;
    private final FileStructureService      fileService;

    @GetMapping
    public List<Investor> getAll() {
        return repo.findAll();
    }

    @GetMapping("/{name}")
    public ResponseEntity<Investor> getByName(@PathVariable String name) {
        return repo.findByNameIgnoreCase(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Investor investor) {
        if (repo.existsByNameIgnoreCase(investor.getName())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Investor already exists: " + investor.getName()));
        }
        investor.recalc();
        Investor saved = repo.save(investor);
        // Create investor folder
        fileService.ensureInvestorFolder(saved.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Investor updated) {
        return repo.findById(id).map(inv -> {
            inv.setInitialBalance(updated.getInitialBalance());
            inv.setCapitalReturned(updated.getCapitalReturned());
            inv.setDefaultSharePct(updated.getDefaultSharePct());
            inv.setNotes(updated.getNotes());
            inv.recalc();
            return ResponseEntity.ok(repo.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Return capital to investor */
    @PostMapping("/{id}/return-capital")
    public ResponseEntity<?> returnCapital(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        return repo.findById(id).map(inv -> {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            inv.setCapitalReturned(inv.getCapitalReturned().add(amount));
            inv.recalc();
            return ResponseEntity.ok(repo.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Get all vehicles associated with this investor */
    @GetMapping("/{name}/vehicles")
    public Map<String, Object> getInvestorVehicles(@PathVariable String name) {
        var stock = vehicleRepo.findByInvestorOrderByDateAcquiredDesc(name);
        var sold  = soldRepo.findByInvestorOrderByDateSoldDesc(name);
        var invoices = invoiceRepo.findByInvestorNameOrderByInvoiceDateDesc(name);

        BigDecimal totalInvested = stock.stream()
                .map(v -> v.getTotalCost() != null ? v.getTotalCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfit = sold.stream()
                .map(s -> s.getInvestorProfit() != null ? s.getInvestorProfit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "currentStock",    stock,
            "soldHistory",     sold,
            "invoices",        invoices,
            "totalInvested",   totalInvested,
            "totalProfit",     totalProfit
        );
    }
}
