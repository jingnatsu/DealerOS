package com.dealeros.repository;

import com.dealeros.model.Vehicle;
import com.dealeros.model.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByStockId(String stockId);
    Optional<Vehicle> findByPlateIgnoreCase(String plate);

    List<Vehicle> findByStatusOrderByDateAcquiredDesc(VehicleStatus status);
    List<Vehicle> findByInvestorOrderByDateAcquiredDesc(String investor);

    boolean existsByPlateIgnoreCase(String plate);
    boolean existsByStockId(String stockId);

    @Query("SELECT v FROM Vehicle v WHERE v.status = 'STOCK' ORDER BY v.dateAcquired ASC")
    List<Vehicle> findCurrentStock();

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(v.stockId, 9) AS int)), 0) FROM Vehicle v WHERE v.stockId LIKE 'SA-%'")
    Integer findMaxStockSequence();

    @Query("SELECT v FROM Vehicle v WHERE LOWER(v.plate) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(v.model) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Vehicle> search(String q);
}
