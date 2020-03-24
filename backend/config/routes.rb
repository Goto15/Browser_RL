Rails.application.routes.draw do
  resources :games, only: %i[show index create new]
  resources :users, only: %i[show index create new]
end
