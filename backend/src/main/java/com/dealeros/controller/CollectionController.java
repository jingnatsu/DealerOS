package com.dealeros.controller;

import com.dealeros.model.*;
import com.dealeros.repository.CollectionEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionEntryRepository repo;

    @GetMapping
    public List<CollectionEntry> getAll() {
        return repo.findAllByOrderByScheduledDateDesc();
    }

    @GetMapping("/pending-collections")
    public List<CollectionEntry> getPendingCollections() {
        return repo.findByTypeOrderByScheduledDateAsc(CollectionType.COLLECTION)
                .stream().filter(c -> !"Collected".equals(c.getStatus())).toList();
    }

    @GetMapping("/pending-deliveries")
    public List<CollectionEntry> getPendingDeliveries() {
        return repo.findByTypeOrderByScheduledDateAsc(CollectionType.DELIVERY)
                .stream().filter(c -> !"Delivered".equals(c.getStatus())).toList();
    }

    @PostMapping
    public ResponseEntity<CollectionEntry> create(@RequestBody CollectionEntry entry) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CollectionEntry updated) {
        return repo.findById(id).map(e -> {
            e.setType(updated.getType());
            e.setPlate(updated.getPlate());
            e.setModel(updated.getModel());
            e.setDateWon(updated.getDateWon());
            e.setScheduledDate(updated.getScheduledDate());
            e.setDriver(updated.getDriver());
            e.setAddress(updated.getAddress());
            e.setPostcode(updated.getPostcode());
            e.setDistance(updated.getDistance());
            e.setCost(updated.getCost());
            e.setStatus(updated.getStatus());
            e.setLinkedPlates(updated.getLinkedPlates());
            e.setNotes(updated.getNotes());
            return ResponseEntity.ok(repo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        return repo.findById(id).map(e -> {
            e.setStatus(body.get("status"));
            return ResponseEntity.ok(repo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
