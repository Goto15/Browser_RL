Rails.application.routes.draw do
  resources :games, only: %i[show index]
  resources :users, only: %i[show index]
end
