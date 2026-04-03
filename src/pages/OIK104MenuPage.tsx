import React from 'react';
import { Typography } from 'antd';
import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { RecipeTable } from '../components/RecipeTable';

const { Title } = Typography;

export const OIK104MenuPage: React.FC<{ isEditor: boolean }> = ({ isEditor }) => {
  const { recipes, loading, updateRecipe, refetch } = useRecipes('OIK104');
  const { ingredients } = useIngredients();

  return (
    <div style={{ padding: '24px 24px 0' }}>
      <Title level={3} style={{ color: '#60a5fa', marginBottom: 20 }}>OIK104 MENU</Title>
      <RecipeTable
        recipes={recipes}
        loading={loading}
        ingredients={ingredients}
        onUpdate={updateRecipe}
        onRefresh={refetch}
        isEditor={isEditor}
      />
    </div>
  );
};
