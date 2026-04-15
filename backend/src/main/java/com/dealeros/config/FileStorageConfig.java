package com.dealeros.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    @Value("${dealeros.files.base-path:../files}")
    private String basePath;

    @Value("${dealeros.excel.path:../Master_Spreadsheet_TRIAL_sanitised.xlsx}")
    private String excelPath;

    public Path getBasePath() {
        return Paths.get(basePath).toAbsolutePath().normalize();
    }

    public Path getExcelPath() {
        return Paths.get(excelPath).toAbsolutePath().normalize();
    }

    /**
     * Returns the root folder for a given stockId, creating it if it doesn't exist.
     * Structure:
     *   files/{stockId}/
     *     Photos/
     *     Documents/
     *     ServiceHistory/
     *     MOT/
     *     Purchase/
     *     Sale/
     *     Delivery/
     *     Collection/
     */
    public Path getVehicleFolder(String stockId) throws IOException {
        Path root = getBasePath().resolve("Cars").resolve(stockId);
        createVehicleFolderStructure(root);
        return root;
    }

    public Path getInvestorFolder(String investorName) throws IOException {
        Path root = getBasePath().resolve("Investors").resolve(sanitiseName(investorName));
        Files.createDirectories(root.resolve("Invoices"));
        Files.createDirectories(root.resolve("Agreements"));
        Files.createDirectories(root.resolve("Statements"));
        return root;
    }

    private void createVehicleFolderStructure(Path root) throws IOException {
        String[] subFolders = {
            "Photos", "Documents", "ServiceHistory",
            "MOT", "Purchase", "Sale", "Delivery", "Collection"
        };
        for (String folder : subFolders) {
            Files.createDirectories(root.resolve(folder));
        }
    }

    private String sanitiseName(String name) {
        return name.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}
