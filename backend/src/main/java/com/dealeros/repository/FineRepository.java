package com.dealeros.repository;

import com.dealeros.model.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByStatusOrderByDateIssuedDesc(String status);
    List<Fine> findByPlateIgnoreCase(String plate);
    List<Fine> findAllByOrderByDateIssuedDesc();

    @Query("SELECT SUM(f.amount) FROM Fine f WHERE f.status != 'Paid'")
    BigDecimal sumUnpaid();
}
