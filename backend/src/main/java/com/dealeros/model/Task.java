package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "tasks")
@EntityListeners(AuditingEntityListener.class)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Lob
    private String description;

    /** Optional vehicle link */
    private String stockId;
    private String plate;
    private String vehicleLabel;

    /** Pending / In Progress / Done / Cancelled */
    private String status;

    /** Normal / Urgent */
    private String priority;

    private LocalDate dueDate;
    private String    assignedTo;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
