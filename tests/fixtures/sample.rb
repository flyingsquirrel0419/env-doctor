db_url = ENV['DATABASE_URL']
api_key = ENV.fetch('STRIPE_API_KEY')
ruby_var = ENV['RUBY_ONLY_VAR']
debug = ENV.fetch('DEBUG_MODE')

puts db_url, api_key, ruby_var, debug
