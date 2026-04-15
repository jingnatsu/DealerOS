package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "fines")
@EntityListeners(AuditingEntityListener.class)
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stockId;
    private String plate;
    private String model;

    /**
     * PCN — Parking / PCN — Bus Lane / PCN — Congestion Zone / PCN — ULEZ /
     * Speeding / Red Light / DVLA / Admin / Other
     */
    private String fineType;

    private LocalDate dateIssued;
    private LocalDate dueDate;
    private BigDecimal amount;
    private String reference;

    /** Unpaid / Paid / Appealing / Written Off */
    private String status;

    /** Path to the fine notice document */
    private String documentPath;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
