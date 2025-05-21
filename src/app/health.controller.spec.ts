import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HealthController', () => {
    let controller: HealthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();

        controller = module.get<HealthController>(HealthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('check', () => {
        it('should return health status with correct structure', () => {
            const result = controller.check();

            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('database', 'connected');

            // Verify timestamp is a valid ISO string
            expect(() => new Date(result.timestamp)).not.toThrow();
        });
    });
});