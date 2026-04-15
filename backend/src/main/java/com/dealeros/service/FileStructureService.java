package com.dealeros.service;

import com.dealeros.config.FileStorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages physical file storage for vehicles and investors.
 *
 * Vehicle folder structure:
 *   files/Cars/{stockId}/
 *     Photos/
 *     Documents/
 *     ServiceHistory/
 *     MOT/
 *     Purchase/
 *     Sale/
 *     Delivery/
 *     Collection/
 *
 * Investor folder structure:
 *   files/Investors/{name}/
 *     Invoices/
 *     Agreements/
 *     Statements/
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStructureService {

    private final FileStorageConfig config;

    // ── Vehicle folders ───────────────────────────────────

    public void ensureVehicleFolder(String stockId) {
        try {
            config.getVehicleFolder(stockId);
            log.info("Vehicle folder ready: Cars/{}", stockId);
        } catch (IOException e) {
            log.error("Failed to create vehicle folder for {}: {}", stockId, e.getMessage());
            throw new RuntimeException("Could not create vehicle folder: " + e.getMessage());
        }
    }

    /**
     * Saves an uploaded file into the correct vehicle subfolder.
     *
     * @param stockId      vehicle stock ID
     * @param fileCategory PHOTO / DOCUMENT / SERVICE_HISTORY / MOT / PURCHASE / SALE / DELIVERY / COLLECTION
     * @param file         the uploaded file
     * @return relative path from /files root, e.g. "Cars/SA-2026-00001/Photos/front-angle.jpg"
     */
    public String saveVehicleFile(String stockId, String fileCategory, MultipartFile file) throws IOException {
        Path vehicleRoot = config.getVehicleFolder(stockId);
        String subFolder = categoryToFolder(fileCategory);
        Path target = vehicleRoot.resolve(subFolder);
        Files.createDirectories(target);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "upload");
        // Prevent duplicates with timestamp prefix
        String fileName = System.currentTimeMillis() + "_" + originalName;
        Path dest = target.resolve(fileName);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        return "Cars/" + stockId + "/" + subFolder + "/" + fileName;
    }

    /**
     * Lists all files in a vehicle subfolder.
     */
    public List<String> listVehicleFiles(String stockId, String fileCategory) throws IOException {
        Path vehicleRoot = config.getVehicleFolder(stockId);
        String subFolder = categoryToFolder(fileCategory);
        Path target = vehicleRoot.resolve(subFolder);

        List<String> result = new ArrayList<>();
        if (Files.exists(target)) {
            Files.list(target).forEach(p -> result.add(
                "Cars/" + stockId + "/" + subFolder + "/" + p.getFileName().toString()
            ));
        }
        return result;
    }

    /**
     * Deletes a specific file from a vehicle folder.
     */
    public void deleteVehicleFile(String stockId, String fileCategory, String fileName) throws IOException {
        Path vehicleRoot = config.getVehicleFolder(stockId);
        String subFolder = categoryToFolder(fileCategory);
        Path target = vehicleRoot.resolve(subFolder).resolve(fileName);
        Files.deleteIfExists(target);
    }

    // ── Investor folders ──────────────────────────────────

    public void ensureInvestorFolder(String investorName) {
        try {
            config.getInvestorFolder(investorName);
            log.info("Investor folder ready: Investors/{}", investorName);
        } catch (IOException e) {
            log.error("Failed to create investor folder for {}: {}", investorName, e.getMessage());
        }
    }

    public String saveInvestorFile(String investorName, String subFolder, MultipartFile file) throws IOException {
        Path investorRoot = config.getInvestorFolder(investorName);
        Path target = investorRoot.resolve(subFolder);
        Files.createDirectories(target);

        String fileName = System.currentTimeMillis() + "_" +
                StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload");
        Files.copy(file.getInputStream(), target.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        return "Investors/" + investorName + "/" + subFolder + "/" + fileName;
    }

    // ── Helpers ───────────────────────────────────────────

    private String categoryToFolder(String category) {
        if (category == null) return "Documents";
        return switch (category.toUpperCase()) {
            case "PHOTO"           -> "Photos";
            case "SERVICE_HISTORY" -> "ServiceHistory";
            case "MOT"             -> "MOT";
            case "PURCHASE"        -> "Purchase";
            case "SALE"            -> "Sale";
            case "DELIVERY"        -> "Delivery";
            case "COLLECTION"      -> "Collection";
            default                -> "Documents";
        };
    }
}
