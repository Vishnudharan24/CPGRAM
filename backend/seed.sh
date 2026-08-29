#!/bin/sh
set -e

echo "Seeding data..."
python -m app.services.seed_mock_data
echo "Done!"
