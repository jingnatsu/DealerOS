package com.dealeros.service;

import com.dealeros.config.FileStorageConfig;
import com.dealeros.model.*;
import com.dealeros.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository       vehicleRepo;
    private final FinanceEntryRepository  financeRepo;
    private final FileStorageConfig       fileStorage;

    // ── Stock ID generation ───────────────────────────────

    /**
     * Generates the next Stock ID in format SA-YYYY-NNNNN.
     * Thread-safe via @Transactional.
     */
    @Transactional
    public String generateStockId() {
        Integer maxSeq = vehicleRepo.findMaxStockSequence();
        int next = (maxSeq == null ? 0 : maxSeq) + 1;
        return String.format("SA-%d-%05d", Year.now().getValue(), next);
    }

    // ── CRUD ──────────────────────────────────────────────

    @Transactional
    public Vehicle addVehicle(Vehicle v) {
        if (v.getPlate() != null) {
            v.setPlate(v.getPlate().toUpperCase().replaceAll("\\s+", ""));
        }
        if (vehicleRepo.existsByPlateIgnoreCase(v.getPlate())) {
            throw new IllegalArgumentException("Plate " + v.getPlate() + " already exists in stock.");
        }

        v.setStockId(generateStockId());
        v.setStatus(VehicleStatus.STOCK);
        v.recalcTotalCost();

        Vehicle saved = vehicleRepo.save(v);

        // Create folder structure immediately
        try {
            fileStorage.getVehicleFolder(saved.getStockId());
            saved.setFolderPath("Cars/" + saved.getStockId());
            vehicleRepo.save(saved);
        } catch (IOException e) {
            log.warn("Could not create folder structure for {}: {}", saved.getStockId(), e.getMessage());
        }

        return saved;
    }

    public List<Vehicle> getCurrentStock() {
        return vehicleRepo.findCurrentStock();
    }

    public List<Vehicle> getAll() {
        return vehicleRepo.findAll();
    }

    public Optional<Vehicle> findByStockId(String stockId) {
        return vehicleRepo.findByStockId(stockId);
    }

    public Optional<Vehicle> findByPlate(String plate) {
        return vehicleRepo.findByPlateIgnoreCase(plate);
    }

    public List<Vehicle> search(String q) {
        return vehicleRepo.search(q);
    }

    @Transactional
    public Vehicle update(String stockId, Vehicle updated) {
        Vehicle existing = vehicleRepo.findByStockId(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + stockId));

        // Copy editable fields
        existing.setModel(updated.getModel());
        existing.setMake(updated.getMake());
        existing.setColour(updated.getColour());
        existing.setYear(updated.getYear());
        existing.setMileage(updated.getMileage());
        existing.setFuelType(updated.getFuelType());
        existing.setTransmission(updated.getTransmission());
        existing.setBodyType(updated.getBodyType());
        existing.setEngineSize(updated.getEngineSize());
        existing.setPurchasePrice(updated.getPurchasePrice());
        existing.setReconCost(updated.getReconCost());
        existing.setSource(updated.getSource());
        existing.setInvestor(updated.getInvestor());
        existing.setInvestorSharePct(updated.getInvestorSharePct());
        existing.setDateAcquired(updated.getDateAcquired());
        existing.setMotExpiry(updated.getMotExpiry());
        existing.setNeedsMot(updated.getNeedsMot());
        existing.setListedWebsite(updated.getListedWebsite());
        existing.setListedAutoTrader(updated.getListedAutoTrader());
        existing.setListedCargurus(updated.getListedCargurus());
        existing.setAtStatus(updated.getAtStatus());
        existing.setIgStatus(updated.getIgStatus());
        existing.setPrepNotes(updated.getPrepNotes());
        existing.setPrepComplete(updated.getPrepComplete());
        existing.setNotes(updated.getNotes());

        // Recalc total cost from stored finance entries
        refreshTotalCost(existing);

        return vehicleRepo.save(existing);
    }

    @Transactional
    public void updateStatus(String stockId, VehicleStatus status) {
        vehicleRepo.findByStockId(stockId).ifPresent(v -> {
            v.setStatus(status);
            vehicleRepo.save(v);
        });
    }

    /**
     * Adds a cost to a vehicle and refreshes its total cost.
     */
    @Transactional
    public void addCost(String stockId, FinanceEntry entry) {
        Vehicle v = vehicleRepo.findByStockId(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + stockId));
        entry.setStockId(stockId);
        entry.setPlate(v.getPlate());
        entry.setModel(v.getModel());
        if (entry.getDate() == null) entry.setDate(LocalDate.now());
        financeRepo.save(entry);
        refreshTotalCost(v);
        vehicleRepo.save(v);
    }

    /** Recomputes totalCost = purchasePrice + sum of all FinanceEntries for this vehicle */
    public void refreshTotalCost(Vehicle v) {
        BigDecimal entriesSum = financeRepo.sumByStockId(v.getStockId());
        BigDecimal purchase   = v.getPurchasePrice() != null ? v.getPurchasePrice() : BigDecimal.ZERO;
        v.setAdditionalCosts(entriesSum != null ? entriesSum : BigDecimal.ZERO);
        v.recalcTotalCost();
    }

    @Transactional
    public void delete(String stockId) {
        vehicleRepo.findByStockId(stockId).ifPresent(v -> {
            // Keep finance entries for audit trail but mark vehicle as deleted
            vehicleRepo.delete(v);
        });
    }
}
