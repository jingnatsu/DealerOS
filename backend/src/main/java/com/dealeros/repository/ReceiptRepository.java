package com.dealeros.repository;

import com.dealeros.model.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    List<Receipt> findByStockIdOrderByReceiptDateDesc(String stockId);
    List<Receipt> findByPlateIgnoreCaseOrderByReceiptDateDesc(String plate);
    List<Receipt> findAllByOrderByReceiptDateDesc();
}
