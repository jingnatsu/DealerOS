package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Sold vehicle record — written once a sale is finalised.
 * stockId links back to the original Vehicle record.
 *
 * Matches the Excel "Sold Stock" sheet columns:
 *   Month | Date Acquired | Plate | Make & Model | Investor | Total Cost |
 *   Sold | Part Ex | Investor Share % | Total Profit | Investor Profit |
 *   SA Profit | Date Listed | Date Sold | Days to Sell
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "sold_vehicles")
@EntityListeners(AuditingEntityListener.class)
public class SoldVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Links to original Vehicle.stockId */
    @Column(name = "stock_id", nullable = false)
    private String stockId;

    private String plate;
    private String make;
    private String model;
    private String investor;
    private String source;

    // ── Dates ─────────────────────────────────────────────
    private LocalDate dateAcquired;
    private LocalDate dateListed;
    private LocalDate dateSold;
    private Integer   daysInStock;

    // ── Financials ────────────────────────────────────────
    private BigDecimal purchasePrice;
    private BigDecimal totalCost;       // All-in cost
    private BigDecimal soldPrice;
    private BigDecimal partExValue;     // Part exchange taken in
    private BigDecimal grossProfit;     // soldPrice - totalCost
    private Integer    investorSharePct;
    private BigDecimal investorProfit;  // grossProfit * investorSharePct/100
    private BigDecimal saProfit;        // grossProfit - investorProfit

    // ── Sale info ─────────────────────────────────────────
    private String platform;        // AutoTrader / Facebook / Website / Forecourt / etc.
    private String customerName;
    private String contactInfo;
    private String warranty;        // Yes/No + type
    private String invoiceNumber;
    private String autoguard;       // Autoguard warranty reference
    private String paymentMethod;   // Cash / Bank Transfer / Finance

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
