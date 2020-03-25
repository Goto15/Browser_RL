class UsersController < ApplicationController

  def index
    render json: User.all
  end

  def show
    render json: User.find(params[:id])
  end

  def new
  end

  def create
    found_user = User.all.find_by(name: params[:name])
    
    if !(found_user.nil?)
      user = found_user
    else 
      user = User.new
      user.name = params[:name]
      user.save
    end

    render json: user
  end

end
