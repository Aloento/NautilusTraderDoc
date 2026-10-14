# Portfolio

The Python Portfolio exposes read-only account, PnL, exposure, margin, and snapshot queries.
Instrument PnL and exposure queries accept fresh price overrides where applicable, and all eight
scalar and collection PnL and exposure queries accept an optional target currency. Conversion
failure returns no value for scalar methods and `net_exposures`, while PnL collection methods
raise. No method returns a partial mixed-currency total. The authoritative update and lifecycle
commands remain internal to the Rust engine.

Auto-generated from the latest source. See [`nautilus_trader.portfolio`](https://nautilustrader.io/docs/python-api-latest/#module-nautilus_trader.portfolio) in the official documentation.

