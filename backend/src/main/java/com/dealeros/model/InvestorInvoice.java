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
 * Generated investor invoice — created via "Sell a Car" flow.
 * One invoice per sold vehicle.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "investor_invoices")
@EntityListeners(AuditingEntityListener.class)
public class InvestorInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique invoice number e.g. INV-2026-00042 */
    @Column(unique = true, nullable = false)
    private String invoiceNumber;

    private String stockId;
    private String plate;
    private String model;
    private String make;
    private String colour;
    @Column(name = "model_year")
    private Integer year;
    private Integer mileage;

    private String investorName;
    private Integer investorSharePct;

    private LocalDate saleDate;
    private LocalDate invoiceDate;

    // ── Financials (snapshot at point of sale) ────────────
    private BigDecimal purchasePrice;
    private BigDecimal reconCost;
    private BigDecimal additionalCosts;
    private BigDecimal totalCost;
    private BigDecimal salePrice;
    private BigDecimal grossProfit;
    private BigDecimal investorAmount;   // grossProfit * sharePct/100
    private BigDecimal saAmount;         // grossProfit - investorAmount

    /** Cash / Bank Transfer / Finance */
    private String paymentMethod;

    private String customerName;
    private String warranty;

    /** Path to generated PDF / print copy */
    private String pdfPath;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
