package com.medicareplus.userservice.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.medicareplus.userservice.common.dto.AppResponse;
import com.medicareplus.userservice.department.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheStatsController {

    private final CacheManager cacheManager;
    private final DepartmentService departmentService;


    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public AppResponse<Map<String, Object>> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();

        cacheManager.getCacheNames().forEach(cacheName -> {
            CaffeineCache caffeineCache = (CaffeineCache) cacheManager.getCache(cacheName);
            if (caffeineCache != null) {
                Cache<Object, Object> nativeCache = caffeineCache.getNativeCache();
                Map<String, Object> cacheStats = new HashMap<>();
                cacheStats.put("size", nativeCache.estimatedSize());
                cacheStats.put("hitCount", nativeCache.stats().hitCount());
                cacheStats.put("missCount", nativeCache.stats().missCount());
                cacheStats.put("hitRate", String.format("%.2f%%", nativeCache.stats().hitRate() * 100));
                cacheStats.put("evictionCount", nativeCache.stats().evictionCount());
                stats.put(cacheName, cacheStats);
            }
        });

        return AppResponse.success(stats);
    }

    @GetMapping("/evict")
    @PreAuthorize("hasRole('ADMIN')")
    public AppResponse<String> evictAllCaches() {
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) cache.clear();
        });
        return AppResponse.success("All caches evicted successfully.");
    }

    @GetMapping("/benchmark")
    @PreAuthorize("hasRole('ADMIN')")
    public AppResponse<Map<String, Object>> benchmark() {
        Map<String, Object> result = new HashMap<>();

        cacheManager.getCache("departments").clear();

        long start1 = System.currentTimeMillis();
        departmentService.getAllDepartments();
        long dbTime = System.currentTimeMillis() - start1;

        long start2 = System.currentTimeMillis();
        departmentService.getAllDepartments();
        long cacheTime = System.currentTimeMillis() - start2;

        result.put("dbCallMs", dbTime);
        result.put("cacheHitMs", cacheTime);
        result.put("improvementFactor", dbTime > 0 ?
                String.format("%.1fx faster", (double) dbTime / Math.max(cacheTime, 1)) : "N/A");
        result.put("message", "Cache reduces response time for departments data");

        return AppResponse.success(result);
    }
}