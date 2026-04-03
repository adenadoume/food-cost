import React from 'react';
import { Typography } from 'antd';
import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { RecipeTable } from '../components/RecipeTable';

const { Title } = Typography;

export const OIK512MenuPage: React.FC = () => {
  const { recipes, loading, updateRecipe, refetch } = useRecipes('OIK512');
  const { ingredients } = useIngredients();

  return (
    <div style={{ padding: '24px 24px 0' }}>
      <Title level={3} style={{ color: '#a78bfa', marginBottom: 20 }}>
        OIK5.12 MENU
      </Title>
      <RecipeTable
        recipes={recipes}
        loading={loading}
        ingredients={ingredients}
        onUpdate={updateRecipe}
        onRefresh={refetch}
      />
    </div>
  );
};
