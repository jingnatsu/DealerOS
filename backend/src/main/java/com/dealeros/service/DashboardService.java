package com.dealeros.service;

import com.dealeros.model.VehicleStatus;
import com.dealeros.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Aggregates data for the Dashboard page.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VehicleRepository      vehicleRepo;
    private final SoldVehicleRepository  soldRepo;
    private final FinanceEntryRepository financeRepo;
    private final FineRepository         fineRepo;
    private final ViewingRepository      viewingRepo;
    private final InvestorRepository     investorRepo;
    private final CollectionEntryRepository colRepo;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // Stock counts
        long stockCount    = vehicleRepo.findByStatusOrderByDateAcquiredDesc(VehicleStatus.STOCK).size();
        long reservedCount = vehicleRepo.findByStatusOrderByDateAcquiredDesc(VehicleStatus.RESERVED).size();
        long soldCount     = soldRepo.count();

        // Profit this month
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate today        = LocalDate.now();
        var soldThisMonth = soldRepo.findByDateSoldBetween(firstOfMonth, today);
        BigDecimal profitThisMonth = soldThisMonth.stream()
                .map(s -> s.getGrossProfit() != null ? s.getGrossProfit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Outstanding fines
        BigDecimal outstandingFines = fineRepo.sumUnpaid();

        // Upcoming viewings
        long upcomingViewings = viewingRepo.findByStatusOrderByViewingDateAscViewingTimeAsc("Booked").size();

        // Pending collections
        long pendingCollections = colRepo.findByStatusOrderByScheduledDateAsc("Pending").size()
                + colRepo.findByStatusOrderByScheduledDateAsc("Booked").size();

        // MOT expiring in 90 days
        var motExpiring = vehicleRepo.findCurrentStock().stream()
                .filter(v -> v.getMotExpiry() != null &&
                        v.getMotExpiry().isBefore(LocalDate.now().plusDays(90)))
                .count();

        stats.put("stockCount",        stockCount);
        stats.put("reservedCount",     reservedCount);
        stats.put("soldTotal",         soldCount);
        stats.put("profitThisMonth",   profitThisMonth);
        stats.put("outstandingFines",  outstandingFines != null ? outstandingFines : BigDecimal.ZERO);
        stats.put("upcomingViewings",  upcomingViewings);
        stats.put("pendingCollections", pendingCollections);
        stats.put("motExpiringSoon",   motExpiring);

        return stats;
    }

    /** Monthly profit trend — last 8 months */
    public List<Map<String, Object>> getMonthlyProfitTrend() {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int m = 7; m >= 0; m--) {
            LocalDate first = today.minusMonths(m).withDayOfMonth(1);
            LocalDate last  = first.withDayOfMonth(first.lengthOfMonth());

            var soldInMonth = soldRepo.findByDateSoldBetween(first, last);
            BigDecimal profit = soldInMonth.stream()
                    .map(s -> s.getGrossProfit() != null ? s.getGrossProfit() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", first.toString().substring(0, 7));  // YYYY-MM
            entry.put("profit", profit);
            entry.put("sold", soldInMonth.size());
            result.add(entry);
        }
        return result;
    }
}
