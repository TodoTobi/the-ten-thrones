// src/__tests__/performance.test.ts

import { describe, it, expect, vi } from 'vitest';

import { PerformanceManager } from '../systems/PerformanceManager';



describe('THE TEN THRONES — PerformanceManager & Escalado Adaptativo', () => {

  const createMocks = () => {

    const mockRenderer = {

      setPixelRatio: vi.fn(),

      shadowMap: { enabled: true },

    } as any;



    const mockPostProcessing = {

      setBloomEnabled: vi.fn(),

      setSize: vi.fn(),

    } as any;



    return { mockRenderer, mockPostProcessing };

  };



  it('Degrada automáticamente un nivel de calidad cuando los FPS caen por debajo de 48', () => {

    const { mockRenderer, mockPostProcessing } = createMocks();

    const perf = new PerformanceManager(mockRenderer, mockPostProcessing, 'high');



    // Simular 90 fotogramas lentos a 33 FPS (delta = 0.030s) avanzando el reloj

    vi.spyOn(performance, 'now').mockReturnValue(10000);

    for (let i = 0; i < 90; i++) {

      perf.recordFrame(0.030);

    }



    expect(perf.getCurrentPreset().tier).toBe('medium');

    expect(mockPostProcessing.setBloomEnabled).toHaveBeenCalledWith(false);

  });



  it('Ignora pausas largas de pestaña en segundo plano (> 250ms) sin degradar la calidad', () => {

    const { mockRenderer, mockPostProcessing } = createMocks();

    const perf = new PerformanceManager(mockRenderer, mockPostProcessing, 'ultra');



    perf.recordFrame(1.5); // Pausa de 1.5 segundos por minimizar ventana

    expect(perf.getCurrentPreset().tier).toBe('ultra');

  });

});
