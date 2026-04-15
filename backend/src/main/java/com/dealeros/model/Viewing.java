package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "viewings")
@EntityListeners(AuditingEntityListener.class)
public class Viewing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String phone;
    private String email;

    /** stockId of the vehicle the customer is interested in */
    private String stockId;
    private String plate;
    private String vehicleLabel;   // "Mazda CX3 AY17YWX"

    private LocalDate viewingDate;
    private LocalTime viewingTime;

    /** Website / Auto Trader / CarGurus / Word of Mouth / Recurring / Other */
    private String leadSource;

    /** No / Yes / Maybe */
    private String financeInterest;

    /** No / Yes / Maybe */
    private String deliveryRequired;

    /** Booked / Arrived / Bought / Deposit Paid / No Show / Cancelled */
    private String status;

    private String outcome;

    @Lob
    private String notes;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
