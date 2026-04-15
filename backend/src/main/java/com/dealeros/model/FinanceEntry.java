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
 * A single finance/expense entry.
 * Matches Excel "Expense" sheet: Month | Date | Category | From | Amount | Payment Method | Paid By | Notes
 * Also covers per-vehicle costs (linked via stockId/plate).
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "finance_entries")
@EntityListeners(AuditingEntityListener.class)
public class FinanceEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Linked vehicle stock ID (null = overhead / not vehicle-specific) */
    private String stockId;
    private String plate;
    private String model;

    private LocalDate date;

    /** Parts / Labour / Valet / MOT / Transport / Fuel / Warranty / Fees / Fixed Overhead / Other */
    private String category;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    /** Cash / Debit Card / Bank Transfer / etc. */
    private String paymentMethod;

    /** Business / Personal */
    private String paidBy;

    /** Receipt file path (relative to vehicle folder or receipts folder) */
    private String receiptPath;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
