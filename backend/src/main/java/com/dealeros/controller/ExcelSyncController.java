package com.dealeros.controller;

import com.dealeros.service.ExcelSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/excel")
@RequiredArgsConstructor
public class ExcelSyncController {

    private final ExcelSyncService excelService;

    /**
     * Import from the default Excel file path configured in application.properties.
     * POST /api/excel/import
     */
    @PostMapping("/import")
    public ResponseEntity<?> importDefault() {
        try {
            Map<String, Integer> result = excelService.importFromDefaultFile();
            return ResponseEntity.ok(Map.of(
                "message", "Import complete",
                "counts",  result
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Import from an uploaded Excel file.
     * POST /api/excel/import/upload
     */
    @PostMapping("/import/upload")
    public ResponseEntity<?> importUpload(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Integer> result = excelService.importFromExcel(file.getInputStream());
            return ResponseEntity.ok(Map.of(
                "message", "Import complete",
                "counts",  result
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Export entire DB to Excel.
     * GET /api/excel/export
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export() {
        try {
            byte[] bytes = excelService.exportToExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"DealerOS_Export.xlsx\"")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
