package com.dealeros.controller;

import com.dealeros.model.Viewing;
import com.dealeros.repository.ViewingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/viewings")
@RequiredArgsConstructor
public class ViewingController {

    private final ViewingRepository repo;

    @GetMapping
    public List<Viewing> getAll() {
        return repo.findAllByOrderByViewingDateDescViewingTimeDesc();
    }

    @GetMapping("/booked")
    public List<Viewing> getBooked() {
        return repo.findByStatusOrderByViewingDateAscViewingTimeAsc("Booked");
    }

    @GetMapping("/by-date/{date}")
    public List<Viewing> getByDate(@PathVariable String date) {
        return repo.findByViewingDateOrderByViewingTimeAsc(LocalDate.parse(date));
    }

    @PostMapping
    public ResponseEntity<Viewing> create(@RequestBody Viewing viewing) {
        if (viewing.getStatus() == null) viewing.setStatus("Booked");
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(viewing));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Viewing updated) {
        return repo.findById(id).map(v -> {
            v.setCustomerName(updated.getCustomerName());
            v.setPhone(updated.getPhone());
            v.setEmail(updated.getEmail());
            v.setStockId(updated.getStockId());
            v.setPlate(updated.getPlate());
            v.setVehicleLabel(updated.getVehicleLabel());
            v.setViewingDate(updated.getViewingDate());
            v.setViewingTime(updated.getViewingTime());
            v.setLeadSource(updated.getLeadSource());
            v.setFinanceInterest(updated.getFinanceInterest());
            v.setDeliveryRequired(updated.getDeliveryRequired());
            v.setStatus(updated.getStatus());
            v.setOutcome(updated.getOutcome());
            v.setNotes(updated.getNotes());
            return ResponseEntity.ok(repo.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        return repo.findById(id).map(v -> {
            v.setStatus(body.get("status"));
            if (body.containsKey("outcome")) v.setOutcome(body.get("outcome"));
            return ResponseEntity.ok(repo.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        var all       = repo.findAllByOrderByViewingDateDescViewingTimeDesc();
        long booked    = all.stream().filter(v -> "Booked".equals(v.getStatus())).count();
        long converted = all.stream().filter(v -> "Bought".equals(v.getStatus()) || "Deposit Paid".equals(v.getStatus())).count();
        long noShow    = all.stream().filter(v -> "No Show".equals(v.getStatus())).count();
        double convRate = all.isEmpty() ? 0 : (double) converted / all.size() * 100;
        return Map.of(
            "total", all.size(), "booked", booked,
            "converted", converted, "noShow", noShow,
            "conversionRate", Math.round(convRate)
        );
    }
}
