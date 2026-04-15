package com.dealeros.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a vehicle in current stock.
 * stockId is the primary business key across the entire system.
 * Format: SA-YYYY-NNNNN  (e.g. SA-2026-00001)
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "vehicles")
@EntityListeners(AuditingEntityListener.class)
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Primary business key — SA-YYYY-NNNNN */
    @Column(name = "stock_id", unique = true, nullable = false)
    private String stockId;

    // ── Vehicle identity ─────────────────────────────────
    @NotBlank
    @Column(unique = true)
    private String plate;           // Registration plate, e.g. AY17YWX

    private String make;            // e.g. Mazda
    private String model;           // e.g. CX3 Sport Nav
    private String colour;
    @Column(name = "model_year")
    private Integer year;
    private Integer mileage;
    private String fuelType;        // Petrol / Diesel / Hybrid / Electric
    private String transmission;    // Manual / Automatic
    private String bodyType;        // Hatchback / Saloon / SUV / Estate / Coupe / Van
    private String engineSize;      // e.g. 2.0

    // ── Purchase ─────────────────────────────────────────
    private BigDecimal purchasePrice;
    private BigDecimal reconCost;           // Reconditioning / prep costs
    private BigDecimal additionalCosts;     // Other costs logged via finance
    private BigDecimal totalCost;           // purchasePrice + reconCost + additionalCosts
    private LocalDate  dateAcquired;

    @Column(name = "source")
    private String source;          // Copart / Motorway / Carwow / Facebook / Private / Part Exchange / BCA

    /** Part exchange value if this car was taken as PX */
    private BigDecimal pxValue;

    // ── Investor ─────────────────────────────────────────
    private String investor;        // MP / James / Daniel / Joseph / Jeff / Adam / Anthony / Leonardo
    private Integer investorSharePct;

    // ── Status & listing ─────────────────────────────────
    @Enumerated(EnumType.STRING)
    private VehicleStatus status;   // STOCK / RESERVED / SOLD / SOR / WRITTEN_OFF

    private Boolean listedWebsite   = false;
    private Boolean listedAutoTrader = false;
    private Boolean listedCargurus  = false;

    @Enumerated(EnumType.STRING)
    private AutoTraderStatus atStatus; // NONE / DRAFT / NEEDS_REVIEW / READY / LIVE / FAILED

    @Enumerated(EnumType.STRING)
    private InstagramStatus igStatus;  // NONE / DRAFT / SCHEDULED / POSTED

    // ── MOT / Insurance ──────────────────────────────────
    private LocalDate  motExpiry;
    private Boolean    needsMot    = false;
    private LocalDate  lastInsuranceCheck;
    private String     insuranceStatus;

    // ── Preparation ──────────────────────────────────────
    @Lob
    private String prepNotes;       // What still needs doing
    private Boolean prepComplete = false;

    // ── Storage ──────────────────────────────────────────
    /** Relative path under /files/Cars/{stockId} */
    private String folderPath;

    // ── Free text ────────────────────────────────────────
    @Lob
    private String notes;

    // ── Audit ─────────────────────────────────────────────
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ─────────────────────────────────────────────────────
    // Convenience: total cost helper
    // ─────────────────────────────────────────────────────
    public void recalcTotalCost() {
        BigDecimal p = purchasePrice    != null ? purchasePrice    : BigDecimal.ZERO;
        BigDecimal r = reconCost        != null ? reconCost        : BigDecimal.ZERO;
        BigDecimal a = additionalCosts  != null ? additionalCosts  : BigDecimal.ZERO;
        this.totalCost = p.add(r).add(a);
    }
}
