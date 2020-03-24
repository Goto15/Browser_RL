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
    user = User.new
    user.name = params[:name]
    user.save
  end

end
