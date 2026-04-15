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
 * A scanned / uploaded receipt.
 * After processing, a corresponding FinanceEntry is created.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "receipts")
@EntityListeners(AuditingEntityListener.class)
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stockId;
    private String plate;

    private String category;    // Fuel / Parts / Labour / Valet / MOT / Transport / etc.

    private LocalDate receiptDate;
    private BigDecimal amount;
    private String supplier;

    /** Relative path to stored image in vehicle Photos/Receipts folder */
    private String filePath;

    /** ID of the created FinanceEntry (null until processed) */
    private Long financeEntryId;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
