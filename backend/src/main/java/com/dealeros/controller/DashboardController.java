package com.dealeros.controller;

import com.dealeros.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return service.getDashboardStats();
    }

    @GetMapping("/profit-trend")
    public List<Map<String, Object>> getProfitTrend() {
        return service.getMonthlyProfitTrend();
    }
}
