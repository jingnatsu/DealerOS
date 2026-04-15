package com.dealeros.controller;

import com.dealeros.model.FinanceEntry;
import com.dealeros.repository.FinanceEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceEntryRepository repo;

    @GetMapping
    public List<FinanceEntry> getAll(@RequestParam(required = false) String category) {
        return category != null ? repo.findByCategoryOrderByDateDesc(category)
                                : repo.findAllByOrderByDateDesc();
    }

    @GetMapping("/overheads")
    public List<FinanceEntry> getOverheads() {
        return repo.findOverheads();
    }

    @PostMapping
    public ResponseEntity<FinanceEntry> create(@RequestBody FinanceEntry entry) {
        if (entry.getDate() == null) entry.setDate(LocalDate.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody FinanceEntry updated) {
        return repo.findById(id).map(e -> {
            e.setDate(updated.getDate());
            e.setDescription(updated.getDescription());
            e.setCategory(updated.getCategory());
            e.setAmount(updated.getAmount());
            e.setPaymentMethod(updated.getPaymentMethod());
            e.setPaidBy(updated.getPaidBy());
            e.setNotes(updated.getNotes());
            return ResponseEntity.ok(repo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        var all = repo.findAllByOrderByDateDesc();
        var totalLogged  = all.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        var vehicleCosts = all.stream().filter(e -> e.getStockId() != null && !e.getStockId().isBlank())
                             .mapToDouble(e -> e.getAmount().doubleValue()).sum();
        var overheads    = all.stream().filter(e -> e.getStockId() == null || e.getStockId().isBlank())
                             .mapToDouble(e -> e.getAmount().doubleValue()).sum();
        var thisMonth    = all.stream()
                .filter(e -> e.getDate() != null && e.getDate().getMonth() == LocalDate.now().getMonth()
                        && e.getDate().getYear() == LocalDate.now().getYear())
                .mapToDouble(e -> e.getAmount().doubleValue()).sum();

        return Map.of(
            "totalLogged",  totalLogged,
            "vehicleCosts", vehicleCosts,
            "overheads",    overheads,
            "thisMonth",    thisMonth,
            "entryCount",   all.size()
        );
    }
}
