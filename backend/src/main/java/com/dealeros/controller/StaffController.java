package com.dealeros.controller;

import com.dealeros.model.*;
import com.dealeros.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffRepository       staffRepo;
    private final WagePaymentRepository wageRepo;

    @GetMapping
    public List<Staff> getActive() {
        return staffRepo.findByActiveTrue();
    }

    @GetMapping("/all")
    public List<Staff> getAll() {
        return staffRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<Staff> create(@RequestBody Staff staff) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffRepo.save(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Staff updated) {
        return staffRepo.findById(id).map(s -> {
            s.setName(updated.getName());
            s.setRole(updated.getRole());
            s.setPayType(updated.getPayType());
            s.setPayRate(updated.getPayRate());
            s.setActive(updated.getActive());
            s.setNotes(updated.getNotes());
            return ResponseEntity.ok(staffRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Wage payments ─────────────────────────────────────

    @GetMapping("/payments")
    public List<WagePayment> getAllPayments() {
        return wageRepo.findAllByOrderByPaymentDateDesc();
    }

    @GetMapping("/{id}/payments")
    public List<WagePayment> getPayments(@PathVariable Long id) {
        return wageRepo.findByStaffIdOrderByPaymentDateDesc(id);
    }

    @PostMapping("/payments")
    public ResponseEntity<WagePayment> logPayment(@RequestBody WagePayment payment) {
        if (payment.getPaymentDate() == null) payment.setPaymentDate(LocalDate.now());
        // Resolve staff name
        staffRepo.findById(payment.getStaffId()).ifPresent(s -> payment.setStaffName(s.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(wageRepo.save(payment));
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        var all      = staffRepo.findByActiveTrue();
        var payments = wageRepo.findAllByOrderByPaymentDateDesc();
        double totalPaid = payments.stream()
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount().doubleValue() : 0).sum();
        double thisMonth = payments.stream()
                .filter(p -> p.getPaymentDate() != null
                          && p.getPaymentDate().getMonth() == LocalDate.now().getMonth()
                          && p.getPaymentDate().getYear()  == LocalDate.now().getYear())
                .mapToDouble(p -> p.getAmount().doubleValue()).sum();
        return Map.of(
            "staffCount", all.size(),
            "totalPaid", totalPaid,
            "thisMonth", thisMonth
        );
    }
}
