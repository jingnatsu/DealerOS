package com.dealeros.controller;

import com.dealeros.model.ServiceRecord;
import com.dealeros.repository.ServiceRecordRepository;
import com.dealeros.service.FileStructureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/service-records")
@RequiredArgsConstructor
public class ServiceRecordController {

    private final ServiceRecordRepository repo;
    private final FileStructureService    fileService;

    @GetMapping
    public List<ServiceRecord> getAll() {
        return repo.findAllByOrderByServiceDateDesc();
    }

    @GetMapping("/by-vehicle/{stockId}")
    public List<ServiceRecord> getByVehicle(@PathVariable String stockId) {
        return repo.findByStockIdOrderByServiceDateDesc(stockId);
    }

    @PostMapping
    public ResponseEntity<ServiceRecord> create(@RequestBody ServiceRecord record) {
        if (record.getInvoiceRef() == null) {
            record.setInvoiceRef("SVC-" + System.currentTimeMillis());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(record));
    }

    @PostMapping("/{id}/document")
    public ResponseEntity<?> uploadDocument(@PathVariable Long id,
                                            @RequestParam("file") MultipartFile file) {
        return repo.findById(id).map(r -> {
            try {
                String path = fileService.saveVehicleFile(r.getStockId(), "SERVICE_HISTORY", file);
                r.setDocumentPath("/" + path);
                return ResponseEntity.ok(repo.save(r));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Upload failed: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
