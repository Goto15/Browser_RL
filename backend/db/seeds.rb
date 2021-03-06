# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
User.destroy_all
Game.destroy_all

ben = User.create(name: 'Ben')
lugh = User.create(name: 'Lugh')
tester = User.create(name: 'Hades')

Game.create(user: ben, score: 500)
Game.create(user: ben, score: 450)
Game.create(user: ben, score: 525)

Game.create(user: lugh, score: 500)
Game.create(user: lugh, score: 450)
Game.create(user: lugh, score: 350)

Game.create(user: tester, score: rand(10))
Game.create(user: tester, score: rand(10))
Game.create(user: tester, score: rand(10))
