package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * A photo or document file attached to a vehicle.
 * Physical file lives at /files/Cars/{stockId}/Photos/{fileName} (or Documents/, etc.)
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "vehicle_photos")
@EntityListeners(AuditingEntityListener.class)
public class VehiclePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String stockId;

    private String fileName;

    /**
     * Relative web path — served at /files/Cars/{stockId}/Photos/{fileName}
     */
    private String filePath;

    /**
     * Slot tag from the ordered template:
     * front-angle / front / side / rear-angle / rear / dashboard /
     * front-seats / rear-seats / mileage / screen / service-history /
     * wheels / boot / engine-bay / damage / keys
     */
    private String tag;

    /** Display order (0-based) */
    private Integer orderIndex;

    /** Whether this is the cover / primary photo */
    private Boolean isCover = false;

    /** PHOTO / DOCUMENT / SERVICE_HISTORY / MOT / PURCHASE / SALE / DELIVERY / COLLECTION */
    private String fileCategory;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
