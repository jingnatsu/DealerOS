package com.dealeros.controller;

import com.dealeros.model.*;
import com.dealeros.repository.*;
import com.dealeros.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService        vehicleService;
    private final FileStructureService  fileService;
    private final FinanceEntryRepository financeRepo;
    private final VehiclePhotoRepository photoRepo;

    // ── Stock list ────────────────────────────────────────

    @GetMapping
    public List<Vehicle> getCurrentStock() {
        return vehicleService.getCurrentStock();
    }

    @GetMapping("/all")
    public List<Vehicle> getAll() {
        return vehicleService.getAll();
    }

    @GetMapping("/search")
    public List<Vehicle> search(@RequestParam String q) {
        return vehicleService.search(q);
    }

    // ── Single vehicle ────────────────────────────────────

    @GetMapping("/{stockId}")
    public ResponseEntity<Vehicle> getByStockId(@PathVariable String stockId) {
        return vehicleService.findByStockId(stockId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-plate/{plate}")
    public ResponseEntity<Vehicle> getByPlate(@PathVariable String plate) {
        return vehicleService.findByPlate(plate)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Create ────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> addVehicle(@RequestBody Vehicle vehicle) {
        try {
            Vehicle saved = vehicleService.addVehicle(vehicle);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Update ────────────────────────────────────────────

    @PutMapping("/{stockId}")
    public ResponseEntity<?> updateVehicle(@PathVariable String stockId,
                                           @RequestBody Vehicle updated) {
        try {
            return ResponseEntity.ok(vehicleService.update(stockId, updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{stockId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String stockId,
                                          @RequestBody Map<String, String> body) {
        try {
            VehicleStatus status = VehicleStatus.valueOf(body.get("status").toUpperCase());
            vehicleService.updateStatus(stockId, status);
            return ResponseEntity.ok(Map.of("status", status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + body.get("status")));
        }
    }

    // ── Delete ────────────────────────────────────────────

    @DeleteMapping("/{stockId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable String stockId) {
        vehicleService.delete(stockId);
        return ResponseEntity.noContent().build();
    }

    // ── Finance (costs) ───────────────────────────────────

    @GetMapping("/{stockId}/costs")
    public List<FinanceEntry> getCosts(@PathVariable String stockId) {
        return financeRepo.findByStockIdOrderByDateDesc(stockId);
    }

    @PostMapping("/{stockId}/costs")
    public ResponseEntity<?> addCost(@PathVariable String stockId,
                                     @RequestBody FinanceEntry entry) {
        try {
            vehicleService.addCost(stockId, entry);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Cost added"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Photos ────────────────────────────────────────────

    @GetMapping("/{stockId}/photos")
    public List<VehiclePhoto> getPhotos(@PathVariable String stockId) {
        return photoRepo.findByStockIdOrderByOrderIndexAsc(stockId);
    }

    @PostMapping("/{stockId}/photos")
    public ResponseEntity<?> uploadPhoto(@PathVariable String stockId,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestParam(defaultValue = "PHOTO") String category,
                                         @RequestParam(required = false) String tag) {
        try {
            String path = fileService.saveVehicleFile(stockId, category, file);

            VehiclePhoto photo = new VehiclePhoto();
            photo.setStockId(stockId);
            photo.setFileName(file.getOriginalFilename());
            photo.setFilePath("/" + path);
            photo.setTag(tag);
            photo.setFileCategory(category);

            // Get next order index
            var existing = photoRepo.findByStockIdOrderByOrderIndexAsc(stockId);
            photo.setOrderIndex(existing.size());
            photo.setIsCover(existing.isEmpty()); // First photo is cover

            return ResponseEntity.status(HttpStatus.CREATED).body(photoRepo.save(photo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{stockId}/photos/{photoId}")
    public ResponseEntity<Void> deletePhoto(@PathVariable String stockId,
                                            @PathVariable Long photoId) {
        photoRepo.findById(photoId).ifPresent(p -> {
            try {
                String fileName = p.getFileName();
                fileService.deleteVehicleFile(stockId, p.getFileCategory(), fileName);
            } catch (Exception ignored) {}
            photoRepo.delete(p);
        });
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{stockId}/photos/{photoId}/cover")
    public ResponseEntity<?> setCover(@PathVariable String stockId,
                                      @PathVariable Long photoId) {
        // Remove cover from current
        photoRepo.findByStockIdAndIsCoverTrue(stockId).ifPresent(p -> {
            p.setIsCover(false);
            photoRepo.save(p);
        });
        // Set new cover
        return photoRepo.findById(photoId).map(p -> {
            p.setIsCover(true);
            return ResponseEntity.ok(photoRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }
}
