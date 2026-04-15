package com.dealeros.controller;

import com.dealeros.model.Fine;
import com.dealeros.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineRepository repo;

    @GetMapping
    public List<Fine> getAll() {
        return repo.findAllByOrderByDateIssuedDesc();
    }

    @GetMapping("/unpaid")
    public List<Fine> getUnpaid() {
        return repo.findByStatusOrderByDateIssuedDesc("Unpaid");
    }

    @PostMapping
    public ResponseEntity<Fine> create(@RequestBody Fine fine) {
        if (fine.getStatus() == null) fine.setStatus("Unpaid");
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(fine));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        return repo.findById(id).map(f -> {
            f.setStatus(body.get("status"));
            return ResponseEntity.ok(repo.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        var all = repo.findAllByOrderByDateIssuedDesc();
        double total    = all.stream().mapToDouble(f -> f.getAmount().doubleValue()).sum();
        double paid     = all.stream().filter(f -> "Paid".equals(f.getStatus()))
                            .mapToDouble(f -> f.getAmount().doubleValue()).sum();
        double unpaid   = all.stream().filter(f -> !"Paid".equals(f.getStatus()))
                            .mapToDouble(f -> f.getAmount().doubleValue()).sum();
        return Map.of(
            "count", all.size(), "total", total,
            "paid", paid, "unpaid", unpaid,
            "unpaidCount", all.stream().filter(f -> !"Paid".equals(f.getStatus())).count()
        );
    }
}
