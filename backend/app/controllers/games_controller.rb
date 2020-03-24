class GamesController < ApplicationController
  def index
    games = Game.all.map do |game|
      {
        user: game.user.name,
        score: game.score
      }
    end
    
    render json: games
  end

  def show
    game = Game.find(params[:id])

    game = {
        user: game.user.name,
        score: game.score
      }

    render json: game
  end
end
