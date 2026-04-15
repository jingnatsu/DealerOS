package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String role;    // Driver / Valeter / Mechanic / Admin / Manager

    /** Daily / Hourly / Monthly / Per Job */
    private String payType;

    private BigDecimal payRate;

    private Boolean active = true;

    @Lob
    private String notes;
}
