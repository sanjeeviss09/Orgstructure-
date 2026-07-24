import time
from functools import wraps
from aira.contracts.request import EngineMetrics, RequestContext

def measure_engine_execution(engine_name: str):
    def decorator(func):
        async def wrapper(self, context: RequestContext, *args, **kwargs):
            start_time = time.perf_counter()
            if engine_name not in context.metrics:
                context.metrics[engine_name] = EngineMetrics()
            
            try:
                result = await func(self, context, *args, **kwargs)
            except Exception as e:
                context.metrics[engine_name].errors.append(str(e))
                raise
            finally:
                end_time = time.perf_counter()
                context.metrics[engine_name].execution_time_ms = (end_time - start_time) * 1000
            return result
        return wrapper
    return decorator
