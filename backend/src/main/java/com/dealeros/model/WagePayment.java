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
@Table(name = "wage_payments")
@EntityListeners(AuditingEntityListener.class)
public class WagePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long   staffId;
    private String staffName;

    private LocalDate  paymentDate;
    private BigDecimal amount;

    /** e.g. "Week 14 Apr 2026" */
    private String period;

    /** Cash / Bank Transfer */
    private String method;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
