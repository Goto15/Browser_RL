# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

User.create(name: 'Ben')
User.create(name: 'Lugh')

Game.create(user_id: 1, score: 500)
Game.create(user_id: 1, score: 450)
Game.create(user_id: 1, score: 525)
Game.create(user_id: 2, score: 500)
Game.create(user_id: 2, score: 450)
Game.create(user_id: 2, score: 350)