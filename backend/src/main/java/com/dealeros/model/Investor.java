package com.dealeros.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Investor budget ledger.
 * Matches Excel "Investor Budget" sheet:
 *   Investors | Initial Balance | Capital Returned | Total Balance |
 *   Purchased | Total Profit | Available
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "investors")
@EntityListeners(AuditingEntityListener.class)
public class Investor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;        // MP / James / Daniel / Joseph / Jeff / Adam / Anthony / Leonardo

    private BigDecimal initialBalance   = BigDecimal.ZERO;
    private BigDecimal capitalReturned  = BigDecimal.ZERO;
    private BigDecimal totalBalance     = BigDecimal.ZERO;   // computed: initialBalance + totalProfit - capitalReturned
    private BigDecimal purchased        = BigDecimal.ZERO;   // total currently invested in stock
    private BigDecimal totalProfit      = BigDecimal.ZERO;   // sum of all investor profits since Nov-25
    private BigDecimal available        = BigDecimal.ZERO;   // totalBalance - purchased

    /** Default profit-share percentage for this investor */
    private Integer defaultSharePct = 30;

    /** Folder path under /files/Investors/{name} */
    private String folderPath;

    @Lob
    private String notes;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /** Recompute derived fields */
    public void recalc() {
        BigDecimal ib = initialBalance  != null ? initialBalance  : BigDecimal.ZERO;
        BigDecimal cr = capitalReturned != null ? capitalReturned : BigDecimal.ZERO;
        BigDecimal tp = totalProfit     != null ? totalProfit     : BigDecimal.ZERO;
        BigDecimal pu = purchased       != null ? purchased       : BigDecimal.ZERO;
        this.totalBalance = ib.add(tp).subtract(cr);
        this.available    = this.totalBalance.subtract(pu);
    }
}
