import os

db_url = os.environ.get('DATABASE_URL')
api_key = os.getenv('STRIPE_API_KEY')
secret = os.environ['JWT_SECRET']
debug = os.getenv('DEBUG_MODE')
python_only = os.getenv('PYTHON_VAR')

print(db_url, api_key, secret, debug, python_only)
