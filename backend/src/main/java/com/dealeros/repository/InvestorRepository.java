package com.dealeros.repository;

import com.dealeros.model.Investor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvestorRepository extends JpaRepository<Investor, Long> {
    Optional<Investor> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
