package com.dealeros.repository;

import com.dealeros.model.InvestorInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InvestorInvoiceRepository extends JpaRepository<InvestorInvoice, Long> {
    Optional<InvestorInvoice> findByInvoiceNumber(String invoiceNumber);
    Optional<InvestorInvoice> findByStockId(String stockId);
    List<InvestorInvoice> findByInvestorNameOrderByInvoiceDateDesc(String investorName);
    List<InvestorInvoice> findAllByOrderByInvoiceDateDesc();

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(i.invoiceNumber, 10) AS int)), 0) FROM InvestorInvoice i WHERE i.invoiceNumber LIKE 'INV-%'")
    Integer findMaxInvoiceSequence();
}
