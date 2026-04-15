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
 * A vehicle collection or delivery movement.
 * Matches Excel "Collection" sheet:
 *   Source | Date Won | Plate | Make & Model | Location | Post Code | Distance | Collection Date | Notes
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "collection_entries")
@EntityListeners(AuditingEntityListener.class)
public class CollectionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** COLLECTION (incoming purchase) or DELIVERY (outgoing to customer) */
    @Enumerated(EnumType.STRING)
    private CollectionType type;

    private String stockId;
    private String plate;
    private String model;

    private LocalDate dateWon;
    private LocalDate scheduledDate;

    private String driver;
    private String address;
    private String postcode;
    private String distance;        // e.g. "180 miles"

    private BigDecimal cost;

    /** Pending / Booked / Collected / Delivered / Cancelled */
    private String status;

    /** Comma-separated list of additional plates in the same run */
    private String linkedPlates;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
