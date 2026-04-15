package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Service history record for a vehicle.
 * Each entry is a service event or a service invoice created in-system.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "service_records")
@EntityListeners(AuditingEntityListener.class)
public class ServiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stockId;
    private String plate;
    private String model;

    /** Full / Partial / None — Created / Electronic Only / Owner Serviced */
    private String serviceType;

    private LocalDate serviceDate;
    private Integer   mileageAtService;
    private Integer   stampCount;

    /** Internal reference e.g. SVC-001234 */
    private String invoiceRef;

    /** Relative path to stored service document in vehicle folder */
    private String documentPath;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
